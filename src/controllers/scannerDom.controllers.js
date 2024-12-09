export const receiveUrl = (req, res) => {
  try {
    console.log(req.body);
    res.status(200).json({ message: "URL recibida" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al recibir la URL" });
  }
};
