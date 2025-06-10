import fpdf
from fpdf.enums import XPos, YPos
def main():
    # Create a PDF object
    name = input("Name: ")
    pdf = fpdf.FPDF(orientation='P', format='A4')
    pdf.add_page()

    # Set font for the PDF
    pdf.set_font("Helvetica", "B", 24)
    pdf.cell(0, 30, "CS50 Shirtificate", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.image("shirtificate.png", x=35, y=60, w=140)

    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 18)
    pdf.text(x=75, y=130, text=f"{name} took CS50")


    # Save the PDF to a file
    pdf.output("shirtificate.pdf")
if __name__ == "__main__":
    main()
