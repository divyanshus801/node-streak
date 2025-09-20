

const createStreak = async(req, res) => {
  try {
    return res.status(200).json({message: "working streak"})
  } catch (error) {
    
  }
}

module.exports = {
  createStreak
};