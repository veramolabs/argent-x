import { FC, useEffect, useState } from "react"

import {
  registryAddress,
  addKey,
  getKeys,
  removeKey,
  Key,
  getDID
} from "../services/registry.service"
import { waitForTransaction } from "../services/wallet.service"
import styles from "../styles/Home.module.css"

export const RegistryDapp: FC = () => {
  const [did, setDid] = useState("")
  const [keys, setKeys] = useState<Key[]>([])
  const [type, setType] = useState("Secp256k1")
  const [publicKey, setPublicKey] = useState("")
  const [lastTransactionHash, setLastTransactionHash] = useState("")
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "approve" | "pending" | "success"
  >("idle")

  const buttonsDisabled = ["approve", "pending"].includes(transactionStatus)

  useEffect(() => {
    ;(async () => {
      if (lastTransactionHash && transactionStatus === "pending") {
        await waitForTransaction(lastTransactionHash)
        setTransactionStatus("success")
      }
    })()
  }, [transactionStatus, lastTransactionHash])

  useEffect(() => {
    ;(async () => {
      const res = await getDID()
      setDid(res)
      setKeys(await getKeys())
    })()
  }, [])

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setTransactionStatus("approve")

      console.log("addKey", type, publicKey)
      const result = await addKey(type, publicKey)
      console.log(result)

      setLastTransactionHash(result.transaction_hash)
      setTransactionStatus("pending")
    } catch (e) {
      console.error(e)
      setTransactionStatus("idle")
    }
  }

  const handleRemoveKey = async (index: number) => {

    try {
      setTransactionStatus("approve")

      console.log("removeKey", index)
      const result = await removeKey(index)
      console.log(result)

      setLastTransactionHash(result.transaction_hash)
      setTransactionStatus("pending")
    } catch (e) {
      console.error(e)
      setTransactionStatus("idle")
    }
  }

  const handleGetKeys = async (e: React.FormEvent) => {
    e.preventDefault()
    try {

      const result = await getKeys()
      console.log(result)
      setKeys(result)

    } catch (e) {
      console.error(e)
      setTransactionStatus("idle")
    }
  }

  return (
    <>
      <h2 style={{ margin: 0 }}>
        <code>{did}</code>
      </h2>
      <h3 style={{ margin: 0 }}>
        Transaction status: <code>{transactionStatus}</code>
      </h3>
      {lastTransactionHash && (
        <a
          href={`https://voyager.online/tx/${lastTransactionHash}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "blue", margin: "0 0 1em" }}
        >
          <code>{lastTransactionHash}</code>
        </a>
      )}
      <div className="columns">
      <form >
        {keys.map((key, index) => (
          <div key={index}>
            Type: {key.type},
            Public Key: {key.publicKey}
            <button onClick={(e) =>{e.preventDefault(); handleRemoveKey(index)}}>Remove key</button>
          </div>
        ))}
      </form>



        <form onSubmit={handleAddKey}>
          <h2 className={styles.title}>Add key</h2>

          <label htmlFor="mint-amount">Key Type</label>
          <select
            onChange={(e) => setType(e.target.value)}
            value={type}
          >
            <option value="Secp256k1">Secp256k1</option>
            <option value="Ed25519">Ed25519</option>
          </select>


          <label htmlFor="mint-amount">Public Key</label>
          <input
            type="text"
            id="mint-amount"
            name="fname"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
          />

          <input type="submit" disabled={buttonsDisabled} value="Add Key" />
          <input type="button" disabled={buttonsDisabled} value="Refresh keys" onClick={handleGetKeys} />
        </form>

        
      </div>
      <h3 style={{ margin: 0 }}>
        Registry address:{" "}
        <code>
          <a
            target="_blank"
            href={`https://voyager.online/contract/${registryAddress}`}
            rel="noreferrer"
          >
            {registryAddress}
          </a>
        </code>
      </h3>
    </>
  )
}
