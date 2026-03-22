import express from "express";
import {
  evaluateAnswerController,
  aiHealthController
} from "../controllers/aiController.js";

const router = express.Router();

// router.post("/evaluate", verifyJWT, evaluateAnswerController);

router.get("/health", aiHealthController);
router.post("/evaluate", evaluateAnswerController);

export default router;
