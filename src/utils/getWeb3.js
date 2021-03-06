import Web3 from 'web3'
import helpers from './helpers'
import { constants } from './constants'
import messages from './messages'

const defaultNetId = helpers.netIdByBranch(constants.branches.CORE)

export async function enableWallet(onAccountChange) {
  if (window.ethereum) {
    try {
      await window.ethereum.enable()
    } catch (e) {
      await onAccountChange(null)
      throw Error(messages.userDeniedAccessToAccount)
    }

    const web3 = new Web3(window.ethereum)
    const accounts = await web3.eth.getAccounts()

    await onAccountChange(accounts[0])
  }
}

export default async function getWeb3(netId, onAccountChange) {
  let web3 = null

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (window.ethereum) {
    web3 = new Web3(window.ethereum)
    console.log('Injected web3 detected.')
    window.ethereum.autoRefreshOnNetworkChange = true
  } else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider)
    console.log('Injected web3 detected.')
  }

  if (!netId) {
    // Load for the first time in the current browser's session
    if (web3) {
      // MetaMask (or another plugin) is injected
      netId = await web3.eth.net.getId()
      if (!(netId in constants.NETWORKS)) {
        // If plugin's netId is unsupported, try to use
        // the previously chosen netId
        netId = window.localStorage.netId
      }
    } else {
      // MetaMask (or another plugin) is not injected,
      // so try to use the previously chosen netId
      netId = window.localStorage.netId
    }
    if (!(netId in constants.NETWORKS)) {
      // If plugin's netId and/or previously chosen netId are not supported,
      // fallback to default netId
      netId = defaultNetId
    }
    window.localStorage.netId = netId
    window.sessionStorage.netId = netId
  }

  netId = Number(netId)

  const network = constants.NETWORKS[netId]
  let netIdName = network.NAME
  let injectedWeb3 = web3 !== null
  let defaultAccount = null
  let networkMatch = false

  if (web3) {
    const accounts = await web3.eth.getAccounts()
    defaultAccount = accounts[0] || null

    if (!defaultAccount) {
      console.error('Unlock your wallet')
    }

    if (web3.currentProvider.publicConfigStore) {
      let currentAccount = defaultAccount ? defaultAccount.toLowerCase() : ''
      web3.currentProvider.publicConfigStore.on('update', async function(obj) {
        const account = obj.selectedAddress
        if (account && account !== currentAccount) {
          currentAccount = account
          await onAccountChange(account)
        }
      })
    }

    const web3NetId = await web3.eth.net.getId()
    if (web3NetId === netId) {
      networkMatch = true
    } else {
      web3 = null
    }
  }

  if (!web3) {
    web3 = new Web3(new Web3.providers.HttpProvider(network.RPC))
  }

  document.title = `${netIdName} - Fuse Delegation DApp`

  return {
    web3Instance: web3,
    netId,
    netIdName,
    injectedWeb3,
    defaultAccount,
    networkMatch
  }
}
