// This is a broken solution to USACO 2020 Jan Platinum Problem 2

#pragma region
#include <bits/stdc++.h>
using namespace std;
// Common Type shorteners and int128
using ll = long long; using ull = unsigned long long; using ld = long double;
using pii = pair<int, int>; using pll = pair<ll, ll>;
template <typename T> using vec = vector<T>;
template <typename K, typename V> using umap = unordered_map<K, V>; template <typename K> using uset = unordered_set<K>;
using vi = vec<int>; using vl = vec<ll>; using vpi = vec<pii>; using vpl = vec<pll>;
#ifdef __SIZEOF_INT128__
using int128 = __int128_t; using uint128 = __uint128_t;
#endif
template<typename I> string intStr(I x) { string ret; while (x > 0) { ret += (x % 10) + '0'; x /= 10; } reverse(ret.begin(), ret.end()); return ret; } // Int to string
// Shorthand Macros
#define INF 0x3f3f3f3f
#define LLINF 0x3f3f3f3f3f3f3f3f
#define mpr make_pair
#define pb push_back
#define popcount __builtin_popcount
#define clz __builtin_clz
#define ctz __builtin_ctz
// Shorthand Function Macros
#define sz(x) ((int)((x).size()))
#define all(x) (x).begin(), (x).end()
#define rep(i, a, b) for (__typeof(a) i = a; i < b; i++)
#define reprev(i, a, b) for (__typeof(a) i = a; i > b; i--)
#define repi(a, b) rep(i, a, b)
#define repj(a, b) rep(j, a, b)
#define repk(a, b) rep(k, a, b)
#define Cmplt(type) bool operator<(const type &o) const
#define Cmpgt(type) bool operator>(const type &o) const
#define Cmpfn(name, type) bool name(const type &a, const type &b)
#define Inop(type) istream& operator>>(istream& in, type &o)
#define Outop(type) ostream& operator<<(ostream& out, type o)
#define Pow2(x) (1LL << (x))
#define scn(type, ...) type __VA_ARGS__; scan(__VA_ARGS__) // scn -> Short for SCan New
// Shorthand Functions
template<typename T> inline void maxa(T& st, T v) { st = max(st, v); }
template<typename T> inline void mina(T& st, T v) { st = min(st, v); }
inline void setprec(ostream& out, int prec) { out << setprecision(prec) << fixed; }
// Out operators and printing for arrays and vectors
template <typename T> ostream& operator<<(ostream& out,vector<T> iter){out<<"[";for(auto t:iter){out<<t<<", ";}out<<"]";return out;}
template <typename T> string arrayStr(T *arr,int sz){string ret = "[";for(int i=0;i<sz;i++){ret+=to_string(arr[i])+", "; } return ret + "]";}
template <typename T> void printArray(T *arr,int sz){for(int i=0;i<sz;i++){cout<<arr[i]<<" "; } cout<<"\n";}
// I/O Operations
inline void scan(){}
template<typename F, typename... R> inline void scan(F &f,R&... r){cin>>f;scan(r...);}
template <typename F> inline void println(F t){cout<<t<<'\n';}
template<typename F, typename... R> inline void println(F f,R... r){cout<<f<<" ";println(r...);}
inline void print(){}
template<typename F, typename... R> inline void print(F f,R... r){cout<<f;print(r...);}
// Debugging
#define db(x) cout << (#x) << ": " << x << ", "
#define dblb(s) cout << "[" << s << "] "
#define dbbin(x, n) cout << (#x) << ": " << bitset<n>(x) << ", "
#define dbarr(x, n) cout << (#x) << ": " << arrayStr((x), (n)) << ", "
#define dbln cout << endl;
#pragma endregion

void init_file_io() {
	const string PROBLEM_ID = "nondec";
	freopen((PROBLEM_ID + ".in").c_str(), "r", stdin);
	freopen((PROBLEM_ID + ".out").c_str(), "w", stdout);
}

struct Qu {
    int i, l, r;
};

const ll MOD = 1e9 + 7;
const int MN = 50001, MQ = 200001, MK = 25;
int n, k, q,
    val[MN];

ll madd(ll a, ll b) { return (a + b) % MOD; }
ll msub(ll a, ll b) { return (a - b + MOD) % MOD; }
ll mmul(ll a, ll b) { return (a * b) % MOD; }
ll fpow(ll x, ll y) {
    if (!y) return 1LL;
    return mmul(fpow(mmul(x, x), y >> 1), (y & 1) ? x : 1LL);
}
ll mdiv(ll x, ll y) { return mmul(x, fpow(y, MOD - 2)); }

ll mat[MN][MK][MK];
void mulLeft(ll st[MK][MK], int val, ll en[MK][MK]) { // multiply by val matrix on the left
    repi(0, k + 1)
        copy(st[i], st[i] + k + 1, en[i]);
    repi(0, k + 1) // all columns
        repj(0, val + 1) // copy to row val
            en[val][i] = madd(en[val][i], st[j][i]);
}
void mulRight(ll st[MK][MK], int val, ll en[MK][MK]) { // multiply by val matrix on the right
    repi(0, k + 1)
        copy(st[i], st[i] + k + 1, en[i]);
    repi(0, val + 1) // copy column val to column i
        repj(0, k + 1) // row
            en[j][i] = madd(en[j][i], st[j][val]);
}
void assign(int val, ll en[MK][MK]) { // assign the val matrix to en
    memset(en, 0, sizeof en);
    repi(0, k + 1) en[i][i] = 1;
    repi(0, val + 1) en[val][i]++;
}
void mulVec(ll mat[MK][MK], ll vec[MK]) {
    static ll sto[MK];
    fill(sto, sto + k + 1, 0LL);
    repi(0, k + 1)
        repj(0, k + 1)
            sto[i] = madd(sto[i], mmul(vec[j], mat[i][j]));
    copy(sto, sto + k + 1, vec);
}

ll tmp[MK];
void solve(int l, int r, vec<Qu> qus) {
    if (qus.empty()) return;
    if (l == r) {
        for (auto &q : qus)
            ans[q.i] = 1LL;
        return;
    }

    int mid = (l + r) / 2;
    assign(val[mid], mat[mid]); assign(val[mid + 1], mat[mid + 1]);
    repi(mid + 2, r + 1)
        mulLeft(mat[i - 1], val[i], mat[i]);
    reprev(i, mid - 1, l - 1)
        mulRight(mat[i + 1], val[i], mat[i]);

    vector<Qu> lhs, rhs;
    for (auto qu : qus) {
        if (qu.l <= mid && qu.r >= mid) {
            fill(tmp, tmp + k + 1, 0); tmp[0] = 1LL;
            mulVec(mat[qu.l], tmp);
            if (qu.r > mid) mulVec(mat[qu.r], tmp);

            repi(1, k + 1)
                ans[qu.i] = madd(ans[qu.i], tmp[i]);
        }
        else if (qu.r < mid) lhs.pb(qu);
        else if (qu.l > mid) rhs.pb(qu);
    }

    solve(l, mid, lhs); solve(mid + 1, r, rhs);
}

Qu qus[MQ];
ll ans[MQ];

int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    scan(n, k);
    repi(1, n + 1) {
        scan(val[i]); 
    }

    scan(q);
    repi(0, q) {
        scn(int, l, r);
        qus[i] = {i, l, r};
    }
    sort(qus, qus + q);

    solve(1, n + 1, vec<Qu>(qus, qus + q));
    repi(0, q)
        println(ans[i]);

    return 0;
}
