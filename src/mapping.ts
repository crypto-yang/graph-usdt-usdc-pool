import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts"
import {
  Transfer,
  Pair
} from "../generated/Pair/Pair"
import { TransferEntity } from "../generated/schema"

let ZERO_BI = BigInt.fromI32(0)
let ONE_BI = BigInt.fromI32(1)
let BI_18 = BigInt.fromI32(18)

function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

export function handleTransfer(event: Transfer): void {
  let hash = event.transaction.hash.toHexString();

  let thisTime = 0;

  for (let i = 0; i < 1000; i++) {
    let exists = TransferEntity.load(hash + '-' + i.toString())

    if (!exists) {
      thisTime = i;
      break;
    }
  }

  let pairContract = Pair.bind(event.address)

  let entity = new TransferEntity(hash + '-' + thisTime.toString());

  entity.from = event.params.from;
  entity.to = event.params.to;

  let balanceOf = pairContract.balanceOf(entity.to as Address);

  entity.contractAddress = event.address;
  entity.rawAmount = event.params.value.toBigDecimal();
  entity.rawBalanceOf = balanceOf.toBigDecimal();
  entity.amount = convertTokenToDecimal(balanceOf, BI_18);

  entity.blockNumber = event.block.number

  entity.save()
}
