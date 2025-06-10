import sys
import os
from PIL import Image, ImageOps

# Valid extensions
valid_exts = [".jpg", ".jpeg", ".png"]

# Check for correct number of command-line arguments
if len(sys.argv) < 3:
    sys.exit("Too few command-line arguments")
elif len(sys.argv) > 3:
    sys.exit("Too many command-line arguments")

# Get file names
input_file = sys.argv[1]
output_file = sys.argv[2]

# Get file extensions
input_ext = os.path.splitext(input_file)[1].lower()
output_ext = os.path.splitext(output_file)[1].lower()

# Check for valid extensions
if input_ext not in valid_exts or output_ext not in valid_exts:
    sys.exit("Input and output must be .jpg, .jpeg, or .png")

# Check that extensions match
if input_ext != output_ext:
    sys.exit("Input and output have different extensions")

# Try to open the input image
try:
    input_image = Image.open(input_file)
except FileNotFoundError:
    sys.exit(f"Could not read {input_file}")

# Open the shirt image
shirt = Image.open("shirt.png")

# Resize and crop input image to match shirt size
input_image = ImageOps.fit(input_image, shirt.size)

# Overlay shirt on top of input image
input_image.paste(shirt, shirt)

# Save the final image
input_image.save(output_file)
