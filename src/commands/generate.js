const chalk = require("chalk");
const resourceGenerator = require("../generators/resourceGenerator");
const projectGenerator = require("../generators/projectGenerator");

module.exports = (program) => {
  const generate = program
    .command("generate")
    .alias("g")
    .description("Generate boilerplate code");

  // Resource generation command
  generate
    .command("resource <n>")
    .option('-m, --model', 'Include Mongoose model generation', false)
    .description(
      "Generate controller, service, routes, and validator for a resource"
    )
    .option("-v, --validation", "Include validation middleware", true)
    .action(async (name, options) => {
      try {
        console.log(chalk.blue(`\n🚀 Generating resource: ${name}\n`));
        await resourceGenerator.generate(name, options);
        console.log(chalk.green("\n✅ Resource generated successfully!\n"));
        console.log(chalk.green("CREATED BY MOSTAFA MAHMOUD\n"));
      } catch (error) {
        console.error(chalk.red("\n❌ Error:"), error.message);
        process.exit(1);
      }
    });

  // Controller only
  generate
    .command("controller <n>")
    .option("--import", "Include Service import")
    .description("Generate only a controller")
    .action(async (name, cmd) => {
      try {
        console.log(chalk.blue(`\n🚀 Generating controller: ${name}\n`));
        await resourceGenerator.generateController(name, { import: cmd.import === true });
        console.log(chalk.green("\n✅ Controller generated successfully!\n"));
        console.log(chalk.green("CREATED BY MOSTAFA MAHMOUD\n"));
      } catch (error) {
        console.error(chalk.red("\n❌ Error:"), error.message);
        process.exit(1);
      }
    });

  // Service only
  generate
    .command("service <n>")
    .description("Generate only a service")
    .action(async (name) => {
      try {
        console.log(chalk.blue(`\n🚀 Generating service: ${name}\n`));
        await resourceGenerator.generateService(name);
        console.log(chalk.green("\n✅ Service generated successfully!\n"));
        console.log(chalk.green("CREATED BY MOSTAFA MAHMOUD\n"));
      } catch (error) {
        console.error(chalk.red("\n❌ Error:"), error.message);
        process.exit(1);
      }
    });

  // Route only
  generate
    .command("route <n>")
    .option("--import", "Include controller and validator imports")
    .description("Generate only routes")
    .action(async (name, cmd) => {
      try {
        console.log(chalk.blue(`\n🚀 Generating routes: ${name}\n`));
        await resourceGenerator.generateRoute(name,{import:cmd.import=== true});
        console.log(chalk.green("\n✅ Routes generated successfully!\n"));
        console.log(chalk.green("CREATED BY MOSTAFA MAHMOUD\n"));
      } catch (error) {
        console.error(chalk.red("\n❌ Error:"), error.message);
        process.exit(1);
      }
    });

  generate
    .command("new <n>")
    .description("Generate a new Express.js project")
    .action(async (name) => {
      try {
        console.log(chalk.blue(`\n🚀 Generating project: ${name}\n`));
        await projectGenerator.generate(name);
        console.log(chalk.green("\n✅ Project generated successfully!\n"));
        console.log(chalk.green("CREATED BY MOSTAFA MAHMOUD\n"));
      } catch (error) {
        console.error(chalk.red("\n❌ Error:"), error.message);
        process.exit(1);
      }
    });
};
