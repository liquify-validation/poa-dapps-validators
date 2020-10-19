/* eslint-disable no-throw-literal */
import FuseConsensus from './fuseConsensus.contract'
import helpers from './helpers'
import helpersGlobal from '../utils/helpers'
import { constants } from '../utils/constants'
import Web3 from 'web3'

export default class Metadata {
  async init({ web3, netId, addresses }) {
    this.web3 = web3
    this.netId = Number(netId)
    this.gasPrice = web3.utils.toWei('1', 'gwei')

    const { METADATA_ADDRESS, MOC } = addresses
    console.log('Metadata contract Address: ', METADATA_ADDRESS)

    const MetadataAbi = await helpers.getABI(constants.NETWORKS[netId].BRANCH, 'ValidatorMetadata')

    this.metadataInstance = new web3.eth.Contract(MetadataAbi, METADATA_ADDRESS)
    if (MOC) {
      this.MOC_ADDRESS = MOC
    }
    this.addresses = addresses

    this.fuseInstance = new FuseConsensus()
    await this.fuseInstance.init({ web3 })
    this.miningKeys = await this.fuseInstance.getValidators()
    this.staked = await this.fuseInstance.getTotalStaked()

    if (window.ethereum) {
      try {
        await window.ethereum.enable()
        this.metaMask = new Web3(window.ethereum)
        this.netId = await this.metaMask.eth.net.getId()
      } catch (e) {
        alert('Error: You denined access to account your delegation wont be shown')
        //throw Error(messages.userDeniedAccessToAccount)
        return
      }
    } else {
      alert('No Metamask (or other Web3 Provider) installed! your delegation wont be shown')
      return
    }
  }
  async createMetadata({
    firstName,
    lastName,
    stakedAmount,
    fullAddress,
    state,
    zipcode,
    validatorFee,
    contactEmail,
    isCompany,
    votingKey,
    hasData
  }) {
    const methodToCall = hasData ? 'changeRequest' : 'createMetadata'
    if (isCompany && isNaN(validatorFee)) {
      validatorFee = 0
    }
    let input = [
      this.web3.utils.fromAscii(firstName),
      this.web3.utils.fromAscii(lastName),
      this.web3.utils.fromAscii(stakedAmount),
      fullAddress,
      this.web3.utils.fromAscii(state),
      this.web3.utils.fromAscii(zipcode),
      validatorFee
    ]
    if (helpersGlobal.isCompanyAllowed(this.netId)) {
      input.push(this.web3.utils.fromAscii(contactEmail))
      input.push(isCompany)
    }
    return await this.metadataInstance.methods[methodToCall](...input).send({
      from: votingKey,
      gasPrice: this.gasPrice
    })
  }

  getMocData() {
    // Barinov, Igor		755 Bounty Dr 202	Foster City	CA	94404 	41	2206724	07/23/2021
    return {
      firstName: 'Igor',
      lastName: 'Barinov',
      fullAddress: '755 Bounty Dr 202, Foster City',
      createdDate: '2017-12-18',
      delegatedAmount: '',
      validatorFee: '2021-07-23',
      stakedAmount: '2206724',
      us_state: 'CA',
      postal_code: '94404',
      contactEmail: '',
      isCompany: false
    }
  }

  async getValidatorData(miningKey) {
    if (!miningKey) {
      return {}
    }

    var addr = ''
    if (this.metaMask !== 'undefined' && this.netId === 122) {
      var account = await this.metaMask.eth.getAccounts()
      addr = account[0]
    }

    var validatorDict = await this.fuseInstance.getStakedToVal(miningKey, addr)
    var fee = await this.fuseInstance.getFee(miningKey)
    // prettier-ignore
    let stakedAmount = validatorDict.TOTAL[0].toFixed(2).toString()
    var delegatedAmount = ''
    // prettier-ignore
    if ( addr !== '') {
      delegatedAmount = validatorDict.YOUR[0].toFixed(2).toString()
    } else {
      delegatedAmount = 'Metamask not set'
    }
    // prettier-ignore
    let validatorFee = fee.toString() + '%'

    // prettier-ignore
    let response = await fetch('http://95.216.161.92:5000//downbot/api/v0.1/node=' + miningKey)
    response = await response.json()

    let contactEmail = typeof response.Node.email !== 'undefined' ? response.Node.email : 'Not set'
    let firstName = typeof response.Node.name !== 'undefined' ? response.Node.name : 'Not set'
    let createdDate = typeof response.Node.website !== 'undefined' ? response.Node.website : 'Not set'
    let isCompany = true
    return {
      firstName,
      lastName: 'you',
      fullAddress: '1234',
      createdDate,
      delegatedAmount,
      validatorFee,
      stakedAmount,
      us_state: 'N/A',
      postal_code: 'N/A',
      contactEmail,
      isCompany
    }
  }

  async getUserAsync(miningKey) {
    let response = await fetch(`'http://95.216.161.92:5000//downbot/api/v0.1/node=${miningKey}`, { mode: 'no-cors' })
    let data = await response.json()
    return data
  }

  async getAllValidatorsData(netId) {
    let all = []
    return new Promise(async (resolve, reject) => {
      const mocAddressLowercase = this.MOC_ADDRESS ? this.MOC_ADDRESS.toLowerCase() : ''
      for (let key of this.miningKeys) {
        let data
        if (key.toLowerCase() === mocAddressLowercase) {
          if (this.mocRemoved) {
            continue
          }
          data = this.getMocData()
        } else {
          data = await this.getValidatorData(key)
        }
        data.address = key
        all.push(data)
      }
      resolve(all)
    })
  }
}
