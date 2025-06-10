#include <cs50.h>
#include <stdio.h>

int add (int a, int b);

int main (void)
{
    int x = get_int("x: ");
    int y = get_int("y: ");
    float z = (float)x / (float)y;
    printf("%0.7f\n", z);
}
