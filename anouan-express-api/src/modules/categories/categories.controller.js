const categoriesService = require('./categories.service');

const getAll = async (req, res, next) => {
  try {
    const categories = await categoriesService.getAll();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const category = await categoriesService.getById(req.params.id);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const newCategory = await categoriesService.create(req.body);
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const updatedCategory = await categoriesService.update(req.params.id, req.body);
    res.json({ success: true, data: updatedCategory });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await categoriesService.remove(req.params.id);
    res.json({ success: true, data: { message: 'Category removed successfully' } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
