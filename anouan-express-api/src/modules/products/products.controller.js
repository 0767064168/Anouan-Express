const productsService = require('./products.service');

const getCatalog = async (req, res, next) => {
  try {
    const filters = {
      categoryId: req.query.categoryId,
      vendorId: req.query.vendorId,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search,
      minRating: req.query.minRating,
      sort: req.query.sort
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };
    const result = await productsService.getCatalog(filters, pagination);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const product = await productsService.getById(req.params.id);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 10;
    const suggestions = await productsService.search(query, limit);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};

const getFeatured = async (req, res, next) => {
  try {
    const products = await productsService.getFeatured();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const getFlashSales = async (req, res, next) => {
  try {
    const products = await productsService.getFlashSales();
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const getVendorProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const vendorId = req.user?.vendorId || req.user?.id || 'v_1';
    
    const result = await productsService.getVendorProducts(vendorId, page, limit, status);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const vendorId = req.user?.vendorId || req.user?.id || 'v_1';
    const data = { ...req.body };
    
    // Parse variants if sent as string (from form-data)
    if (typeof data.variants === 'string') {
      try {
        data.variants = JSON.parse(data.variants);
      } catch (e) {
        data.variants = [];
      }
    }

    data.flashSaleActive = data.flashSaleActive === 'true' || data.flashSaleActive === true;
    if (data.flashSalePrice !== undefined) {
      data.flashSalePrice = parseInt(data.flashSalePrice, 10);
    }

    if (req.files && req.files.length > 0) {
      data.imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    const newProduct = await productsService.create(vendorId, data);
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const vendorId = req.user?.vendorId || req.user?.id || 'v_1';
    const data = { ...req.body };

    if (typeof data.variants === 'string') {
      try {
        data.variants = JSON.parse(data.variants);
      } catch (e) {}
    }

    data.flashSaleActive = data.flashSaleActive === 'true' || data.flashSaleActive === true;
    if (data.flashSalePrice !== undefined) {
      data.flashSalePrice = parseInt(data.flashSalePrice, 10);
    }

    if (req.files && req.files.length > 0) {
      data.imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    const result = await productsService.update(req.params.id, vendorId, data, isAdmin);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const vendorId = req.user?.vendorId || req.user?.id || 'v_1';
    await productsService.softDelete(req.params.id, vendorId, isAdmin);
    res.json({ success: true, data: { message: 'Product deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

const bulkImportCSV = async (req, res, next) => {
  try {
    const vendorId = req.user.vendorId;
    
    if (!req.file && !req.body.csvData) {
      return res.status(400).json({ success: false, message: 'CSV data is required' });
    }
    
    const csvData = req.file ? req.file.buffer.toString() : req.body.csvData;
    const result = await productsService.bulkImportCSV(vendorId, csvData);
    
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const vendorId = req.user?.vendorId || req.user?.id;
    const { delta, stock } = req.body;

    const result = await productsService.updateStock(req.params.id, vendorId, delta, stock, isAdmin);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCatalog,
  getById,
  search,
  getFeatured,
  getFlashSales,
  getVendorProducts,
  create,
  update,
  softDelete,
  adjustStock,
  bulkImportCSV
};
