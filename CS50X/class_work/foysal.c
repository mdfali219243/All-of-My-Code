// we include our liberies
#include <cs50.h>
#include <stdio.h>

void print_row(int length); // the function has defined in line 16.
int main(void)
{
    // ask user for the hight of the bricks
    int hight = get_int("What's the hight: ");
    // ask use what would be the length
    for (int i = 0; i < hight; i++) // we make inner loop so, our row make a piramid.
    print_row(i + 1);
}



    // lets make our own funtion to make the length of the bricks
void print_row(int length)
{
    for (int i = 0; i < length; i++)
    {
        printf("#");
    }
    printf("\n");
}
