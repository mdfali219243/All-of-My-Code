#include <cs50.h>
#include <stdio.h>

void print_left(int space, int length, int row);

// main function
int main(void)
{
    int n;
    do
    {
        n = get_int("row: ");
    }
    while (n < 1 || n > 8);

    for (int i = 0; i < n; i++)
    {
        print_left(n - i - 1, i + 1, i + 1);
    }
}

void print_left(int space, int length, int row)
{
    for (int d = 0; d < space; d++)
    {
        printf(" ");
    }
    for (int i = 0; i < length; i++)
    {
        printf("#");
    }
    for (int e = 0; e < 2; e++)
    {
        printf(" ");
    }
    for (int i = 0; i < row; i++)
    {
        printf("#");
    }
    printf("\n");
}
