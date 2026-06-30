console.log("🚨 Error middleware loaded");

const errorMiddleware = (err, req, res, next) => {
  console.error("❌ Error caught by middleware:");
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
  });
};

export default errorMiddleware;
