const getAllLandTitles = (req, res) => {
  res.json({ message: 'Get all land titles', data: [], user: req.user.id });
};

const createLandTitle = (req, res) => {
  res.json({ message: 'Create land title', data: req.body, createdBy: req.user.id });
};

const updateLandTitle = (req, res) => {
  res.json({ message: `Update land title info ${req.params.id}`, data: req.body, updatedBy: req.user.id });
};

const updateLandTitleStatus = (req, res) => {
  res.json({ message: `Update land title status ${req.params.id}`, status: req.body.status, updatedBy: req.user.id });
};

const cancelLandTitle = (req, res) => {
  res.json({ message: `Cancel land title ${req.params.id}`, cancelled: true, cancelledBy: req.user.id });
};

module.exports = {
  getAllLandTitles,
  createLandTitle,
  updateLandTitle,
  updateLandTitleStatus,
  cancelLandTitle
};