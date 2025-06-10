#include <cs50.h>
#include <stdio.h>

void print_row(int length);
int main(void)
{// we make a do loop for a positive number
int n;
do
{
    n = get_int("What's the size: ");
    for (int i = 0; i < n; i++) // we make inner loop so, our row make a piramid.
    print_row(i + 1);

}
    while (n < 1);
}




void print_row(int length)
{
    for (int i = 0; i < length; i++)
    {
        printf("#");
    }
    printf("\n");
}


