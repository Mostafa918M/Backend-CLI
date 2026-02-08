const fs = require("fs").promises;
const path = require("path");
const chalk = require("chalk");
const fileHelper = require("../utils/fileHelper");
const templates = require("../templates");

class ResourceGenerator {
  async generate(resourceName, options = {}) {
    await this.validateProject();

    const name = this.formatName(resourceName);

    await this.generateController(resourceName);
    await this.generateService(resourceName, { import: options.model });
    await this.generateRoute(resourceName);
    if (options.model) {
      await this.generateModel(resourceName);
    }
    if (options.validation !== false) {
      await this.generateValidation(resourceName);
    }

    await this.registerRouteInApp(name);

    console.log(chalk.gray("\nGenerated files:"));
    console.log(chalk.gray(`  - controllers/${name.lower}.controller.js`));
    console.log(chalk.gray(`  - services/${name.lower}.service.js`));
    console.log(chalk.gray(`  - routes/${name.lower}.routes.js`));
    if (options.validation !== false) {
      console.log(chalk.gray(`  - validators/${name.lower}.validator.js`));
    }
    console.log(
      chalk.green(`\n✓ Route registered in app.js: /api/${name.lower}s`)
    );
  }

  async validateProject() {
    const appJsPath = path.join(process.cwd(), "app.js");
    const packageJsonPath = path.join(process.cwd(), "package.json");

    const appExists = await fileHelper.fileExists(appJsPath);
    const packageExists = await fileHelper.fileExists(packageJsonPath);

    if (!appExists || !packageExists) {
      throw new Error(
        chalk.red("\n❌ No project found in current directory!\n") +
          chalk.yellow("Please create a new project first using:\n") +
          chalk.cyan("  cname g new <project-name>\n")
      );
    }
  }

  async registerRouteInApp(name) {
    const appJsPath = path.join(process.cwd(), "app.js");

    try {
      let appContent = await fileHelper.readFile(appJsPath);

      const importLine = `const ${name.lower}Routes = require('./routes/${name.lower}.routes');`;
      const routeUseNamed = `app.use('/api/${name.lower}s', ${name.lower}Routes);`;
      const routeUseInline = `app.use('/api/${name.lower}s', require('./routes/${name.lower}.routes'));`;

      if (
        appContent.includes(routeUseNamed) ||
        appContent.includes(routeUseInline)
      ) {
        console.log(chalk.yellow(`⚠️  Route already registered in app.js`));
        return;
      }

      const todoComment = "// TODO: Add your routes here";
      const importComment = "//import routes here";

      if (!appContent.includes(importLine)) {
        if (appContent.includes(importComment)) {
          appContent = appContent.replace(
            importComment,
            `${importComment}\n${importLine}`
          );
        } else {
          appContent = appContent.replace(
            /(\nconst .* = require\(.*\);\s*)+/,
            (match) => `${match}\n${importLine}\n`
          );
        }
      }

      if (appContent.includes(todoComment)) {
        appContent = appContent.replace(
          todoComment,
          `${todoComment}\n${routeUseNamed}`
        );
      } else {
        const errorHandlerLine = "app.use(handleNotFound);";
        if (appContent.includes(errorHandlerLine)) {
          appContent = appContent.replace(
            errorHandlerLine,
            `// Routes\n${routeUseNamed}\n\n${errorHandlerLine}`
          );
        }
      }

      await fs.writeFile(appJsPath, appContent, "utf8");
    } catch (error) {
      console.log(
        chalk.yellow(
          `⚠️  Could not auto-register route in app.js: ${error.message}`
        )
      );
      console.log(
        chalk.gray(
          `Please manually add to app.js:\napp.use('/api/${name.lower}s', require('./routes/${name.lower}.routes'));`
        )
      );
    }
  }

  async generateController(resourceName, options = { import: true }) {
    await this.validateProject();
    const name = this.formatName(resourceName);
    let content = templates.controller(name, options);

    const filePath = path.join(
      process.cwd(),
      "controllers",
      `${name.lower}.controller.js`
    );

    await fileHelper.createFile(filePath, content);
  }

  async generateService(resourceName) {
    await this.validateProject();
    const name = this.formatName(resourceName);
    const content = templates.service(name);
    const filePath = path.join(
      process.cwd(),
      "services",
      `${name.lower}.service.js`
    );

    await fileHelper.createFile(filePath, content);
  }

  async generateRoute(resourceName, options = { import: true }) {
    await this.validateProject();
    const name = this.formatName(resourceName);
    let content = templates.route(name);
    if (options.import === false) {
      content = content
        .replace(
          `const ${name.lower}Controller = require('../controllers/${name.lower}.controller');\n`,
          ""
        )
        .replace(
          `const ${name.lower}Validator = require('../validators/${name.lower}.validator');\n`,
          ""
        );
    }
    const filePath = path.join(
      process.cwd(),
      "routes",
      `${name.lower}.routes.js`
    );

    await fileHelper.createFile(filePath, content);

    await this.registerRouteInApp(name);
  }

  async generateValidation(resourceName) {
    await this.validateProject();
    const name = this.formatName(resourceName);
    const content = templates.validation(name);
    const filePath = path.join(
      process.cwd(),
      "validators",
      `${name.lower}.validator.js`
    );

    await fileHelper.createFile(filePath, content);
  }
  async generateModel(resourceName) {
    await this.validateProject();
    const name = this.formatName(resourceName);
    const content = templates.model(name);
    const filePath = path.join(
      process.cwd(),
      "models",
      `${name.lower}.model.js`
    );

    await fileHelper.createFile(filePath, content);
  }

  formatName(name) {
    const clean = name.replace(/[^a-zA-Z0-9]/g, "");

    return {
      lower: clean.toLowerCase(),
      upper: clean.toUpperCase(),
      pascal: clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase(),
      camel: clean.charAt(0).toLowerCase() + clean.slice(1).toLowerCase(),
      original: name,
    };
  }
}

module.exports = new ResourceGenerator();
