<script setup lang="ts">
import { ref } from 'vue'
import TheWelcome from './components/TheWelcome.vue'

import generateClaimant_Legacy from './script/generateClaimant_Legacy';

const count = ref(10000);
const generateRecords_Legacy = () => {
  const claimantRecords = [];

  for (let i = 0; i < count.value; i++) {
    const claimantRecord = generateClaimant_Legacy(i+1);
    claimantRecords.push(claimantRecord);
  }

  const jsonData = JSON.stringify(claimantRecords, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'claimant-records-legacy.json';
  document.body.appendChild(a);

  a.click();

  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <h2>Number of claimants:</h2>
      <input v-model="count" />
      <br/>
      <br/>

      <div>
        <h2>Legacy Model</h2>
        <button @click="generateRecords_Legacy">Generate and Download JSON</button>
      </div>
      <!-- <div>
        <h2>Legacy Model</h2>
        <div>
          Number of claimants:
          <input v-model="count" />
        </div>
        <button @click="generateRecords_Legacy">Generate and Download Claimants</button>
        <button @click="generateRecords_Legacy">Generate and Eligibility</button>
      </div> -->
    </div>
  </header>

  <main>
    <TheWelcome />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
./script/generateClaimant_Legacy