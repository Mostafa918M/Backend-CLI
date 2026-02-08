const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class FileHelper {
  /**
   * Create a file with the given content
   * Creates parent directories if they don't exist
   */
  async createFile(filePath, content) {
    try {
      const dir = path.dirname(filePath);
      await this.ensureDir(dir);

      const exists = await this.fileExists(filePath);
      if (exists) {
        console.log(chalk.yellow(`⚠️  File already exists: ${path.relative(process.cwd(), filePath)}`));
        return;
      }

      await fs.writeFile(filePath, content, 'utf8');
      console.log(chalk.green(`✓ Created: ${path.relative(process.cwd(), filePath)}`));
    } catch (error) {
      throw new Error(`Failed to create file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(chalk.green(`✓ Deleted: ${path.relative(process.cwd(), filePath)}`));
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get relative path from current working directory
   */
  getRelativePath(filePath) {
    return path.relative(process.cwd(), filePath);
  }
}

module.exports = new FileHelper();