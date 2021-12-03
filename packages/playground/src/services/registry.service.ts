import { getStarknet } from "@argent/get-starknet"
import { utils } from "ethers"
import { number, stark, Contract, Abi, uint256, shortString } from "starknet"


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
              "type": "Uint256"
          }
      ],
      "name": "Key",
      "size": 3,
      "type": "struct"
  },
  {
      "members": [
          {
              "name": "low",
              "offset": 0,
              "type": "felt"
          },
          {
              "name": "high",
              "offset": 1,
              "type": "felt"
          }
      ],
      "name": "Uint256",
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
  "0x026baddbacb85e634d59e1f63fb984d6b308533141cefcfba00f91ae00d17512"

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

  const keyuint256 = uint256.bnToUint256(number.toBN(publicKey))
  console.log(type, shortString.encodeShortString(type))

  return await starknet.signer.invokeFunction(
    registryAddress, 
    addKeySelector,
    [
      shortString.encodeShortString(type),
      keyuint256.low,
      keyuint256.high,
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
      const type = shortString.decodeShortString(res.type)
      const publicKey = uint256.uint256ToBN(res.publicKey).toString()

      keys.push({ 
        type,
        publicKey,
      } as Key)
    }
  }

  return keys

}
