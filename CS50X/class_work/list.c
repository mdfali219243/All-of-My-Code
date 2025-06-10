// we include all the header file
#include <stdio.h>
#include <stdlib.h>

// we made our own function
typedef struct node
{
    int number;        // the numbers, the user  will input
    struct node *next; // the number will point the pointer to the  next number
} node;

int main(int argc, char *argv[])
{
    node *list = NULL;

    for (int i = 1; i < argc; i++)
    {
        int number = atoi(argv[i]);
        node *n = malloc(sizeof(node));
        if (n == NULL)
        {
            // Free the mamory
            return 1;
        }
        n->number = number;
        n->next = list;
        list = n;
    }

    node *ptr = list;
    while (ptr != NULL)
    {
        printf("%i\n", ptr->number);
        ptr = ptr->next;
    }
}
