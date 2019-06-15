#include <bits/stdc++.h>

using namespace std;

int main(int argc, char **argv) {
    ifstream fin("input.txt");
    ofstream fout("output.txt");

    cout << "argc: " << argc << ", arg0len: " << strlen(argv[0]) << endl;
    cout << "name: " << argv[0] << endl;
    cout << "input.txt open: " << fin.is_open() << endl;
    
    string s;
    getline(fin, s);
    cout << "first line of input.txt: " << s << endl;

    fout << "Hello, output.txt!" << endl;

    return 0;
}