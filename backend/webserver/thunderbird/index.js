const express = require('express');

module.exports = dependencies => {
  const auth = dependencies('authorizationMW'),
        controller = require('./controller')(dependencies),
        router = express.Router();

  /**
   * @swagger
   * /sync/thunderbird/guide:
   *   get:
   *     tags:
   *       - Sync
   *     description: Gets the guide for TB synchronization with OpenPaas
   *     responses:
   *       200:
   *         $ref: "#/responses/cm_200"
   *       401:
   *         $ref: "#/responses/cm_401"
   *       500:
   *         $ref: "#/responses/cm_500"
   */
  router.get('/thunderbird/guide', auth.requiresAPILogin, controller.renderGuide);

  return router;
};
