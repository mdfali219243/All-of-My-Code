#include <stdio.h>

void meow(int n); // we are difning the function in line 12

int main(void)
{
    meow(5); 
}



void meow(int n) // we make our own function called meow reather than every time printing meow
// we are making our own argrument in this funtion by defining n
{
    for (int i = 0; i < n ; i++)
    {
        printf("meow\n");
    }
}

