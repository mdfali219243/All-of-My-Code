// we are storing some variable by array
//---------->
#include <cs50.h>
#include <stdio.h>

float avarage(int length, int arrays[]);

int main(void)
{
    // we would ask user for what score they want to score
    const int N = 3; // line 10, as well making it constent
    int score [N]; // we are making variable by giving its type .
    for (int i = 0; i < N; i++)
    {
        score[i]= get_int("Score: ");
    }

    printf("Avarage: %f\n", avarage(N, score));// n passed as length
}

// we are making our own function
float avarage(int length, int arrays[])// we are giving it 2 input
{
    int sum = 0;
    // length is the is the N passing as a argument
    for (int i = 0; i < length; i++)// i is the score user would type
    {
        sum += arrays[i];// we are adding all the function
    }
    return sum / (float) length; // we are deviding it
}
