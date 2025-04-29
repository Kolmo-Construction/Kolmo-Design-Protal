// server/routes/punchList.routes.ts
import { Router } from 'express';
import { punchListController } from '../controllers/punchList.controller';
import { validateRequest } from '../middleware/validation.middleware'; // Assuming you have this middleware
import { punchListValidations } from '../validations/punchList.validations'; // Assuming you have punch list specific validations
import { authenticate } from '../middleware/auth.middleware'; // Assuming authentication middleware
import { authorize } from '../middleware/permissions.middleware'; // Assuming authorization middleware
import { permit } from '@/shared/roles'; // Assuming role-based permissions
import { uploadMiddleware } from '../middleware/upload.middleware'; // Assuming file upload middleware


const router = Router();

// Protect all punch list routes
router.use(authenticate);

// GET /api/projects/:projectId/punch-list - Get all punch list items for a project
router.get('/:projectId/punch-list',
    authorize(permit('projectManager', 'client')), // Adjust permissions as needed
    validateRequest({ params: punchListValidations.getProjectPunchListItemsSchema }), // Assuming validation schema exists
    punchListController.getPunchListItemsForProject
);

// GET /api/punch-list/:itemId - Get a specific punch list item by ID
router.get('/:itemId',
    authorize(permit('projectManager', 'client')), // Adjust permissions as needed
    validateRequest({ params: punchListValidations.getPunchListItemByIdSchema }), // Assuming validation schema exists
    punchListController.getPunchListItemById
);

// POST /api/punch-list - Create a new punch list item
router.post('/',
     authorize(permit('projectManager')), // Adjust permissions as needed (e.g., only PM can create)
     validateRequest({ body: punchListValidations.createPunchListItemSchema }), // Assuming validation schema exists
     punchListController.createPunchListItem
);

// PUT /api/punch-list/:itemId - Update a punch list item
router.put('/:itemId',
    authorize(permit('projectManager', 'client')), // Adjust permissions as needed
    validateRequest({ params: punchListValidations.getPunchListItemByIdSchema, body: punchListValidations.updatePunchListItemSchema }), // Assuming validation schemas exist
    punchListController.updatePunchListItem
);

// DELETE /api/punch-list/:itemId - Delete a punch list item and its associated media
router.delete('/:itemId',
    authorize(permit('projectManager')), // Adjust permissions as needed (e.g., only PM can delete)
     validateRequest({ params: punchListValidations.getPunchListItemByIdSchema }), // Assuming validation schema exists
    punchListController.deletePunchListItem
);

// --- New Media Routes ---

// POST /api/punch-list/:itemId/media - Upload media for a punch list item
// Use uploadMiddleware before the controller to handle file processing
router.post('/:itemId/media',
     authorize(permit('projectManager', 'client')), // Adjust permissions (who can upload media?)
     validateRequest({ params: punchListValidations.getPunchListItemByIdSchema }), // Validate item ID
     uploadMiddleware.array('files'), // Assuming 'files' is the field name for file uploads
     punchListController.uploadPunchListItemMedia
);

// DELETE /api/punch-list/:itemId/media/:mediaId - Delete a specific media item for a punch list item
router.delete('/:itemId/media/:mediaId',
     authorize(permit('projectManager', 'client')), // Adjust permissions (who can delete media?)
     validateRequest({ params: punchListValidations.deletePunchListItemMediaSchema }), // Assuming validation schema exists for both IDs
     punchListController.deletePunchListItemMedia
);

// Optional: GET /api/punch-list/:itemId/media - Get media for a specific punch list item
// This might be redundant if media is always eager-loaded with the punch list item,
// but could be useful for specific cases or pagination of media.
// router.get('/:itemId/media',
//      authorize(permit('projectManager', 'client')),
//      validateRequest({ params: punchListValidations.getPunchListItemByIdSchema }),
//      punchListController.getPunchListItemMedia
// );


export default router;