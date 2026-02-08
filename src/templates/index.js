const controller = (name, { import: includeService = true } = {}) => {
  const serviceImport = `const ${name.pascal}Service = require("../services/${name.lower}.service");\n`;

  const serviceCalls = includeService
    ? {
        getAll: `const ${name.pluralLower} = await ${name.pascal}Service.getAll(req.query);`,
        getOne: `const ${name.lower} = await ${name.pascal}Service.getById(req.params.id);`,
        create: `const ${name.lower} = await ${name.pascal}Service.create(req.body);`,
        update: `const ${name.lower} = await ${name.pascal}Service.update(req.params.id, req.body);`,
        delete: `const result = await ${name.pascal}Service.delete(req.params.id);`,
      }
    : {
        getAll: `// TODO: add service logic`,
        getOne: `// TODO: add service logic`,
        create: `// TODO: add service logic`,
        update: `// TODO: add service logic`,
        delete: `// TODO: add service logic`,
      };

  return `const asyncErrorHandler = require("../utils/asyncErrorHandler");
const ApiError = require("../utils/apiError");
const sendResponse = require("../utils/sendResponse");
${includeService ? serviceImport : ""}

class ${name.pascal}Controller {
  async getAll(req, res) {
    ${serviceCalls.getAll}
    return sendResponse(res, 200, "success", "${name.pascal}s fetched successfully", ${includeService ? name.pluralLower : "[]"});
  }

  async getOne(req, res) {
    ${serviceCalls.getOne}

    if (!${includeService ? name.lower : "true"}) {
      throw new ApiError("${name.pascal} not found", 404);
    }

    return sendResponse(res, 200, "success", "${name.pascal} fetched successfully", ${includeService ? name.lower : "{}"});
  }

  async create(req, res) {
    ${serviceCalls.create}
    return sendResponse(res, 201, "success", "${name.pascal} created successfully", ${includeService ? name.lower : "{}"});
  }

  async update(req, res) {
    ${serviceCalls.update}

    if (!${includeService ? name.lower : "true"}) {
      throw new ApiError("${name.pascal} not found", 404);
    }

    return sendResponse(res, 200, "success", "${name.pascal} updated successfully", ${includeService ? name.lower : "{}"});
  }

  async delete(req, res) {
    ${serviceCalls.delete}

    if (!${includeService ? "result" : "true"}) {
      throw new ApiError("${name.pascal} not found", 404);
    }

    return sendResponse(res, 200, "success", "${name.pascal} deleted successfully");
  }
}

const controller = new ${name.pascal}Controller();

module.exports = {
  getAll: asyncErrorHandler(controller.getAll.bind(controller)),
  getOne: asyncErrorHandler(controller.getOne.bind(controller)),
  create: asyncErrorHandler(controller.create.bind(controller)),
  update: asyncErrorHandler(controller.update.bind(controller)),
  delete: asyncErrorHandler(controller.delete.bind(controller)),
};
`;
};

const service = (
  name,
  { import: includeModel = true } = {}
) => {
  const modelImport = `const ${name.pascal} = require("../models/${name.lower}.model");\n`;

  return `${includeModel ? modelImport : ""}class ${name.pascal}Service {

  async getAll(filters = {}) {
    return "this action gets all ${name.pascal}s";
  }

  async getById(id) {
    return \`this action gets ${name.pascal} by #\${id}\`;
  }

  async create(data) {
    return \`this action creates a new ${name.pascal} \${JSON.stringify(data)}\`;
  }

  async update(id, data) {
    return \`this action updates ${name.pascal} by #\${id} with data \${JSON.stringify(data)}\`;
  }

  async delete(id) {
    return \`this action deletes ${name.pascal} by #\${id}\`;
  }
}

module.exports = new ${name.pascal}Service();
`;
};


const route = (name) => `const express = require('express');
const router = express.Router();
const ${name.lower}Controller = require('../controllers/${name.lower}.controller');
const ${name.lower}Validator = require('../validators/${name.lower}.validator');


router.get('/', ${name.lower}Controller.getAll);
router.get('/:id', ${name.lower}Controller.getOne);
router.post('/', ${name.lower}Validator.create, ${name.lower}Controller.create);
router.put('/:id', ${name.lower}Validator.update, ${name.lower}Controller.update);
router.delete('/:id', ${name.lower}Controller.delete);

module.exports = router;
`;

const validation = (name) => `const ApiError = require('../utils/ApiError');
const { body, param, validationResult } = require('express-validator');

const ${name.lower}Validator = {
  /**
   * Validation rules for creating ${name.lower}
   */
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 3 })
      .withMessage('Name must be at least 3 characters'),
    // Add more validation rules as needed
    
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(errors.array()[0].msg, 400));
      }
      next();
    }
  ],

  /**
   * Validation rules for updating ${name.lower}
   */
  update: [
    param('id')
      .notEmpty()
      .withMessage('ID is required'),
    body('name')
      .optional()
      .isLength({ min: 3 })
      .withMessage('Name must be at least 3 characters'),
    // Add more validation rules as needed
    
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(errors.array()[0].msg, 400));
      }
      next();
    }
  ]
};

module.exports = ${name.lower}Validator;
`;
const model = (name)=>`const mongoose = require('mongoose');
const ${name.pascal}Schema = new mongoose.Schema({
// Define your schema fields here
})
module.exports = mongoose.model('${name.pascal}', ${name.pascal}Schema);
`

module.exports = {
  controller,
  service,
  route,
  validation,
  model
};