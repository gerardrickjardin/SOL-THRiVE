const { issueChallenge } = require('./_bot-shield');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    botProtection: issueChallenge(req)
  });
};
