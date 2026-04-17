import qrcode

# Your Google Form Link
form_url = "https://forms.gle/PaeR46GeuVPYCTPm6"

# Initialize QR Code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H, # High error correction for better scanning
    box_size=10,
    border=4,
)

qr.add_data(form_url)
qr.make(fit=True)

# Create the image
# fill_color: The color of the QR dots (Dark Blue)
# back_color: The background (White)
img = qr.make_image(fill_color="#1e40af", back_color="white")

# Save the file in the same folder as your index.html
img.save("registration_qr.png")

print("✅ Success! registration_qr.png has been created.")