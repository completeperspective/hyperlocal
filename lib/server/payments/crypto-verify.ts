import { createPublicClient, getAddress, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'

const isTestnet = process.env.ENABLE_TESTNETS === 'true'
const chain = isTestnet ? baseSepolia : base

export const cryptoPublicClient = createPublicClient({
  chain,
  transport: http(),
})

// Reason: require 3 confirmations to guard against reorg attacks before activating membership.
const MIN_CONFIRMATIONS = 3

export interface VerifyResult {
  ok: boolean
  reason?: string
  valueWei?: bigint
}

export async function verifyOnChainPayment(
  txHash: `0x${string}`,
  receiverAddress: string,
  expectedWei: bigint,
): Promise<VerifyResult> {
  try {
    const [tx, receipt] = await Promise.all([
      cryptoPublicClient.getTransaction({ hash: txHash }),
      cryptoPublicClient.getTransactionReceipt({ hash: txHash }),
    ])

    if (!tx || !receipt) {
      return { ok: false, reason: 'Transaction not found' }
    }

    if (receipt.status !== 'success') {
      return { ok: false, reason: 'Transaction reverted' }
    }

    const normalizedTo = tx.to ? getAddress(tx.to) : null
    const normalizedReceiver = getAddress(receiverAddress)
    if (normalizedTo !== normalizedReceiver) {
      return { ok: false, reason: 'Transaction recipient does not match' }
    }

    if (tx.value < expectedWei) {
      return { ok: false, reason: 'Insufficient payment amount' }
    }

    const currentBlock = await cryptoPublicClient.getBlockNumber()
    const confirmations = currentBlock - receipt.blockNumber
    if (confirmations < MIN_CONFIRMATIONS) {
      return {
        ok: false,
        reason: `Insufficient confirmations: ${confirmations} of ${MIN_CONFIRMATIONS} required`,
      }
    }

    return { ok: true, valueWei: tx.value }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { ok: false, reason: `Verification error: ${message}` }
  }
}
