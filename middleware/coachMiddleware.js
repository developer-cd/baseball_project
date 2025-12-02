export const coachOnly = (req, res, next) => {
  if (req.user && (req.user.role === "coach" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Coaches only" });
  }
};




