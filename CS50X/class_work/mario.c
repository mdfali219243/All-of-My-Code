#include <cs50.h>
#include <stdio.h>

int main(void)
{// we make a do loop for a positive number
int n;
do
{
    n = get_int("What's the size: ");
}
    while (n < 1);

    for (int i = 0; i < n; i++) // we make loop many
    {
        for (int j = 0; j < n; j++)
        {
            printf("#");
        }
        printf("\n");
    }
}

