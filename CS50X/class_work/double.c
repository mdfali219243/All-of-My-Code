#include <cs50.h>
#include <stdio.h>

int main(void)
{
    int n = get_int("the size of sequence: ");
    int sequence[n];
    sequence [0] = 1;
    printf("%i\n", sequence[0]);

    for (int i = sequence[0]; i < n; i++)
    {
        sequence[i] = sequence[i - 1] * 2;
        printf("%i\n", sequence[i]);
    }
}
