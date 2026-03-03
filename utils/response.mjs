export const successResponse = (message, data) => {
  const response = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return response;
};

export const errorResponse = (message) => ({
  success: false,
  message,
});
