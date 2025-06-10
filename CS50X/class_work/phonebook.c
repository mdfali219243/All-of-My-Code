#include <cs50.h>
#include <stdio.h>
#include <string.h>

// we are creating our own data structure
typedef struct
{
    string name;
    string number;
}person;


int main(void)
{
    person people[3]; // we create our array data type/structure

    people[0].name = "Foysal";
    people[0].number = "+1-469-468-1819";

    people[1].name = "Ammou";
    people[1].number = "+1-469-674-4309";

    people[2].name = "Abbou";
    people[2].number = "+1-214-603-7212";

    string name = get_string("Name: ");

    for (int i = 0; i < 3; i++)
    {
        if(strcmp(people[i].name, name) == 0)
        {
            printf("Found %s\n",people[i].number);
            return 0;
        }
    }
    printf("Not Found\n");
    return 1;
}
