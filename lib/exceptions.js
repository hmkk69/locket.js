class LocketError extends Error {
  constructor(message) {
    super(message);
    this.name = "LocketError";
  }
}

class AuthenticationError extends LocketError {
  constructor(message) {
    super(message);
    this.name = "AuthenticationError";
  }
}

class LocketAPIError extends LocketError {
  constructor(message, statusCode = null, responseData = null) {
    super(message);
    this.name = "LocketAPIError";
    this.statusCode = statusCode;
    this.responseData = responseData;
  }
}

class StorageUploadError extends LocketError {
  constructor(message) {
    super(message);
    this.name = "StorageUploadError";
  }
}

module.exports = { LocketError, AuthenticationError, LocketAPIError, StorageUploadError };