"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchProfileController_1 = require("../controllers/searchProfileController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.protect);
// Create a new search profile
router.post('/', searchProfileController_1.createSearchProfile);
// Get all search profiles for the authenticated user
router.get('/', searchProfileController_1.getSearchProfiles);
// Update a search profile
router.put('/:id', searchProfileController_1.updateSearchProfile);
// Delete a search profile
router.delete('/:id', searchProfileController_1.deleteSearchProfile);
exports.default = router;
