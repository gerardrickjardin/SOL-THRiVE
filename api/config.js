module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
};
