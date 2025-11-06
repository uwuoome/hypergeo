// combination (n choose k)
function combination(n: number, k: number) {
    if(k < 0 || k > n) return 0;
    if(k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    let c = 1;
    for(let i = 0; i < k; i++){
        c = c * (n - i) / (i + 1);
    }
    return c;
}

function hypergeometric(N: number, K: number, n: number, k: number) {
    return (combination(K, k) * combination(N - K, n - k)) / combination(N, n);
}

function cumulative(N: number, K: number, n: number, k: number) {
    let sum = 0;
    for(let i = 0; i <= k; i++){
    sum += hypergeometric(N, K, n, i);
    }
    return sum;
}

function inverse(N: number, K: number, n: number, k: number) {
    return 1-cumulative(N, K, n, k-1);
}

function none(N: number, K: number, n: number, k: number) {
    return cumulative(N, K, n, k-1);
}



function choose(n:number, k: number) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let res = 1;
  for (let i = 1; i <= k; i++){
    res = (res * (n - k + i)) / i;
  }
  return res;
}

function multivariatePMF(N: number, Ks: number[], n: number, ks: number[]) {
    const totalChosen = ks.reduce((a, b) => a + b, 0);
    if (totalChosen > n) return 0;
    const others = N - Ks.reduce((a, b) => a + b, 0);
    const remaining = n - totalChosen;
    if (remaining < 0 || remaining > others) return 0;

    let num = 1;
    for (let i = 0; i < Ks.length; i++) {
        num *= choose(Ks[i], ks[i]);
    }
    num *= choose(others, remaining);
    return num / choose(N, n);
}

/**
 * N: Deck size
 * Ks: Ordered sizes of categories in deck.
 * requires: Ordered sizes of numbers required from each category
 * n: Sample size
 */
function combinedRequirements(N: number, Ks: number[], required: number[], n: number) {
    const m = Ks.length;
    const memo = new Map();

    function recurse(i: number, remaining: number, ksSoFar: number[]) {
        if (i === m) {
            // Base case: allocate the rest to other types of cards implicitly
            return multivariatePMF(N, Ks, n, ksSoFar);
        }

        const key = i + "|" + remaining + "|" + ksSoFar.join(",");
        if (memo.has(key)) return memo.get(key);

        let prob = 0;
        const minK = required[i];
        const maxK = Math.min(Ks[i], remaining);
        for (let k = minK; k <= maxK; k++) {
            ksSoFar.push(k);
            prob += recurse(i + 1, remaining - k, ksSoFar);
            ksSoFar.pop();
        }

        memo.set(key, prob);
        return prob;
    }

    return recurse(0, n, []);
}

const hypergeo= {
    exactly: hypergeometric,
    asOrLess: cumulative,
    asOrMore: inverse,
    none,
    combinedRequirements
};
export default hypergeo;