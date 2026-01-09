const db = require("../config/db");

// Delete by ID controller
const deletepoOrderController = (req, res) => {
  const { id } = req.params; // Assuming you send ID in the URL like /delete/5

  

  const query = "DELETE FROM purchase_orders WHERE id = ?";

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting product:", err);
      return res.status(500).json({
        success: false,
        message: "Error while deleting product",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product with id ${id} deleted successfully`,
    });
  });
};

module.exports = deletepoOrderController;
