import express from "express"
import {
  generateWebsite,
  enhancePrompt,
  getApiStatus,
  getUserWebsites,
  getWebsite,
  updateWebsite,
  deleteWebsite,
  deployWebsite,
  undeployWebsite,
} from "../controllers/website.controller.js"
import isAuth from "../middlewares/isAuth.js"

const websiteRouter = express.Router()

// Public
websiteRouter.get("/status", getApiStatus)

// Protected
websiteRouter.post("/generate",        isAuth, generateWebsite)
websiteRouter.post("/enhance-prompt",  isAuth, enhancePrompt)
websiteRouter.get("/",                 isAuth, getUserWebsites)
websiteRouter.get("/:id",              isAuth, getWebsite)
websiteRouter.put("/:id",              isAuth, updateWebsite)
websiteRouter.delete("/:id",           isAuth, deleteWebsite)
websiteRouter.post("/:id/deploy",      isAuth, deployWebsite)
websiteRouter.post("/:id/undeploy",    isAuth, undeployWebsite)

export default websiteRouter
