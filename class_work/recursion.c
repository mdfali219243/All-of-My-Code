#include <cs50.h>
#include <stdio.h>

void draw(int n);

int main(void)
{
    int height = get_int("Hight: ");
    draw(height);
}

void draw(int n)
{
    // if nothing to draw just return
    if (n <= 0)
    {
        return;
    }
    draw(n - 1); // print peramid of n - 1

    for (int i = 0; i < n; i++)
        {
            printf("#");
        }
        printf("\n");
}
