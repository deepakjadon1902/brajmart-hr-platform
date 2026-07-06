export function success(res, data = null, status = 200, meta = undefined) {
  return res.status(status).json({ success: true, data, meta });
}

export function created(res, data = null, meta = undefined) {
  return success(res, data, 201, meta);
}
