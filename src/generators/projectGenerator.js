const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const fileHelper = require('../utils/fileHelper');
const projectTemplates = require('../templates/project');

class ProjectGenerator {
  async generate(projectName) {
    const projectPath = path.join(process.cwd(), projectName);
    
    // Check if project already exists
    try {
      await fs.access(projectPath);
      throw new Error(`Project "${projectName}" already exists!`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // Create project directory
    await fileHelper.ensureDir(projectPath);
    
    console.log(chalk.gray('Creating project structure...\n'));

    // Create directory structure
    const directories = [
      'controllers',
      'services',
      'routes',
      'validators',
      'middlewares',
      'utils',
      'config',
      'logs'
    ];

    for (const dir of directories) {
      await fileHelper.ensureDir(path.join(projectPath, dir));
      console.log(chalk.green(`✓ Created directory: ${dir}/`));
    }

    console.log(chalk.gray('\nGenerating project files...\n'));

    // Generate main files
    await this.createFile(projectPath, 'app.js', projectTemplates.app());
    await this.createFile(projectPath, 'server.js', projectTemplates.server());
    await this.createFile(projectPath, 'package.json', projectTemplates.packageJson(projectName));
    await this.createFile(projectPath, '.env', projectTemplates.env());
    await this.createFile(projectPath, '.gitignore', projectTemplates.gitignore());
    await this.createFile(projectPath, 'README.md', projectTemplates.readme(projectName));

    // Generate utils
    await this.createFile(projectPath, 'utils/logger.js', projectTemplates.logger());
    await this.createFile(projectPath, 'utils/apiError.js', projectTemplates.apiError());
    await this.createFile(projectPath, 'utils/sendResponse.js', projectTemplates.sendResponse());
    await this.createFile(projectPath, 'utils/asyncErrorHandler.js', projectTemplates.asyncErrorHandler());

    // Generate middlewares
    await this.createFile(projectPath, 'middlewares/globalErrorHandler.js', projectTemplates.globalErrorHandler());

    // Create empty logs files
    await this.createFile(projectPath, 'logs/.gitkeep', '');

    console.log(chalk.gray('\n📦 Project structure created successfully!'));
  }

  async createFile(projectPath, relativePath, content) {
    const filePath = path.join(projectPath, relativePath);
    const dir = path.dirname(filePath);
    await fileHelper.ensureDir(dir);
    await fs.writeFile(filePath, content, 'utf8');
    console.log(chalk.green(`✓ Created: ${relativePath}`));
  }
}

module.exports = new ProjectGenerator();