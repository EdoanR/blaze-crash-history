
const resultsDiv = document.querySelector('#results');
const loadingDiv = document.querySelector('#loading');
const statisticsDiv = document.querySelector('#statistics');
const seedInput = document.querySelector('#seed_input');

const clientSeed = "0000000000000000000415ebb64b0d51ccee0bb55826e43846e5bea777d91966";

const amountInput = document.querySelector('#amount_input');
const goodValueInput = document.querySelector('#good_value_input');

let storageAmount = localStorage.getItem('amount');
amountInput.value = storageAmount ? storageAmount : 100;

let storageGoodValue = localStorage.getItem('goodValue');
goodValueInput.value = storageGoodValue ? storageGoodValue : 2;

let timeout = null;

seedInput.addEventListener('keyup', ev => {
    if (ev.key == 'Enter') {
        ev.preventDefault();
        
        OnInputChange();
    }
});

seedInput.addEventListener('input', OnInputChange);
amountInput.addEventListener('input', OnInputChange);
goodValueInput.addEventListener('input', OnInputChange);

function OnInputChange() {
    if (!seedInput.value) {
        loadingDiv.innerHTML = '';
        return;
    }

    let seed = seedInput.value;

    let amount = parseInt(amountInput.value);
    if (!amount && amount !== 0) amount = 100;

    let goodValue = parseFloat(goodValueInput.value);
    if (!goodValue && goodValue !== 0) goodValue = 2;

    if (amount < 800) {
        GetChain(seed, amount, goodValue);
    } else {
        clearTimeout(timeout);
        loadingDiv.innerHTML = 'Loading...';
        timeout = setTimeout(() => {
            GetChain(seed, amount, goodValue);
            loadingDiv.innerHTML = '';
        }, 500);
    }

    localStorage.setItem('amount', amount);
    localStorage.setItem('goodValue', goodValue);
}

function GetChain(seed, amount = 1000, goodValue = 2) {
    resultsDiv.innerHTML = '';

    let chain = [seed];
    amount -= 1;

    if (amount < 0) chain = [];

    for (let i = 0; i < amount; i++) {

        chain.push(
            CryptoJS.algo.SHA256.create()
            .update(chain[chain.length - 1])
            .finalize().toString(CryptoJS.enc.Hex)
        )
        
    }

    chain = chain.map((seed, index) => {

        const hash = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, seed)
        .update(clientSeed)
        .finalize().toString(CryptoJS.enc.Hex)
    
        const divisible = (hash, mod) => {
          let val = 0;
    
          let o = hash.length % 4;
          for (let i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
            val =
              ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) %
              mod;
          }
    
          return val === 0;
        };
    
        const getPoint = (hash) => {
          // In 1 of 15 games the game crashes instantly.
          if (divisible(hash, 15)) return 0;
    
          // Use the most significant 52-bit from the hash to calculate the crash point
          let h = parseInt(hash.slice(0, 52 / 4), 16);
          let e = Math.pow(2, 52);
    
          const point = (
            Math.floor((100 * e - h) / (e - h)) / 100
          ).toFixed(2);
    
          return point;
        }
    
        const point = getPoint(hash);
        return parseFloat(point);
    });

    let goodCount = 0;
    let totalCount = chain.length;

    for (let value of chain) {
        let multiplier = value == 0 ? 1.0 : value;

        const isGood = multiplier >= goodValue;
        if (isGood) goodCount++;

        const div = document.createElement('div');
        div.textContent = multiplier.toFixed(2) + 'X';
        div.className = `crash ${isGood ? 'bom' : 'ruim'}`; 
        resultsDiv.appendChild(div);
    }

    UpdateStatistics(totalCount, goodCount);
}

function UpdateStatistics(totalCount = 0, goodCount = 0) {
    if (!totalCount) {
        statisticsDiv.classList.add('hide');
        return;
    }

    statisticsDiv.classList.remove('hide');
    const lossCount = totalCount - goodCount;
    const goodPercentage = ( (goodCount / totalCount) * 100 ).toFixed(2);
    const lossPercentage = ( (lossCount / totalCount) * 100 ).toFixed(2);

    statisticsDiv.innerHTML = `<span class="good">${goodCount}</span>/${totalCount} Wins (<span class="good">${goodPercentage}%</span> Chance) • <span class="bad">${lossCount}</span>/${totalCount} Losses (<span class="bad">${lossPercentage}%</span> Chance)`;
}