export const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Access denied. Not authenticated." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }

    next();
  };
};

export const isLandlord = requireRoles(["landlord", "admin"]);
export const isSeeker = requireRoles(["house_seeker", "admin"]);
export const isAdmin = requireRoles(["admin"]);
