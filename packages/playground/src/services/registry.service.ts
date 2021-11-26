import { getStarknet } from "@argent/get-starknet"
import { utils } from "ethers"
import { number, stark, Contract, Abi } from "starknet"


const registryAbi: Abi[] = [
  {
      "members": [
          {
              "name": "type",
              "offset": 0,
              "type": "felt"
          },
          {
              "name": "publicKey",
              "offset": 1,
              "type": "felt"
          }
      ],
      "name": "Key",
      "size": 2,
      "type": "struct"
  },
  {
      "inputs": [
          {
              "name": "address",
              "type": "felt"
          }
      ],
      "name": "get_keys_len",
      "outputs": [
          {
              "name": "res",
              "type": "felt"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "name": "address",
              "type": "felt"
          },
          {
              "name": "index",
              "type": "felt"
          }
      ],
      "name": "get_key",
      "outputs": [
          {
              "name": "res",
              "type": "Key"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "name": "key",
              "type": "Key"
          }
      ],
      "name": "add_key",
      "outputs": [],
      "type": "function"
  },
  {
      "inputs": [
          {
              "name": "index",
              "type": "felt"
          }
      ],
      "name": "remove_key",
      "outputs": [],
      "type": "function"
  }
]



export const registryAddress =
  "0x07b4f8fcfc647cbbeac352588faec88b69c1d659128a8ecf8b0d71cbbc3979a2"

const addKeySelector = stark.getSelectorFromName('add_key')
const getKeySelector = stark.getSelectorFromName('get_key')
const removeKeySelector = stark.getSelectorFromName('remove_key')

export const getDID = async (): Promise<string> => {
  const starknet = getStarknet()

  const [activeAccount] = await starknet.enable()

  // checks that enable succeeded
  if (starknet.isConnected === false)
    throw Error("starknet wallet not connected")

  return 'did:scorpius:' + activeAccount
}


export const addKey = async (type: string, publicKey: string): Promise<any> => {
  const starknet = getStarknet()

  const [activeAccount] = await starknet.enable()

  // checks that enable succeeded
  if (starknet.isConnected === false)
    throw Error("starknet wallet not connected")

  return await starknet.signer.invokeFunction(
    registryAddress, 
    addKeySelector,
    [
      utils.parseUnits(type, 0).toString(),
      utils.parseUnits(publicKey, 0).toString(),
    ],
  )
}

export const removeKey = async (index: number): Promise<any> => {
  const starknet = getStarknet()

  const [activeAccount] = await starknet.enable()

  // checks that enable succeeded
  if (starknet.isConnected === false)
    throw Error("starknet wallet not connected")

  return await starknet.signer.invokeFunction(
    registryAddress, 
    removeKeySelector,
    [
      index.toString(),
    ],
  )
}

export interface Key {
  type: string
  publicKey: string
}

export const getKeys = async (): Promise<Key[]> => {
  const starknet = getStarknet()

  const [activeAccount] = await starknet.enable()

  // checks that enable succeeded
  if (starknet.isConnected === false)
    throw Error("starknet wallet not connected")

  const registry = new Contract(registryAbi, registryAddress)

  const result =  await registry.call('get_keys_len', {
    address: activeAccount
  })

  console.log('Length', result)

  const len = number.toBN(result.res).toNumber()

  const keys: Key[] = []

  for (let index = 0; index < len; index++) {
    const {res} = await registry.call('get_key', {
      address: activeAccount,
      index: `${index}`
    }) as any
    if (res.type !== '0x0' && res.publicKey !== '0x0') {

      keys.push({ 
        type: number.hexToDecimalString(res.type as string),
        publicKey: number.hexToDecimalString(res.publicKey as string),
      } as Key)
    }
  }

  return keys

}
