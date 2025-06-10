#include <cs50.h>
#include <stdio.h>

int main(void)
{
    int number = 5;
    int guess = get_int("guess: ");

    if (guess != number)
    {
        printf("Wrong guess\n");
    }
    else                                                                                                                                                                                                                                        
    printf("Correct guess\n");
}
