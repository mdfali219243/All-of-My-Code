#include <cs50.h>
#include <stdio.h>

void print_row(int length, int space);
void print_row2 (int length2);
int main(void)
{
    // Prompt the user for the pyramid's height
    int n;
    do
    {
        n = get_int("Height: ");
    }
    while (n < 1 || n >= 9);

    // Print a pyramid of that height
        // ask use what would be the length
    for (int i = 0; i < n; i++)
    {
    print_row(n - i - 1, i + 1); printf("  "); print_row2(i + 1); printf("\n");
    }
}




void print_row(int space, int length)
{
     for(int i = 0; i < space; i++)
     {
        printf(" ");
     }
    for(int i = 0; i < length; i++)
    {
        printf("#");
    }
}

// our 2nd piramid
void print_row2(int length2)
{
    for (int i = 0; i < length2; i++)
    {
        printf("#");
    }
}

