import { useContext, useEffect, useRef } from 'react'

import ReactTooltip from 'react-tooltip'

import { CairoVMApiContext } from 'context/cairoVMApiContext'

import ExecutionStatus from './ExecutionStatus'

export interface Instruction {
  ap_update: string
  dst_register: string
  fp_update: string
  off0: string
  off1: string
  off2: string
  op0_register: string
  op1_addr: string
  opcode: string
  pc_update: string
  res: string
}

export interface TraceEntry {
  pc: number
  ap: number
  fp: number
}

export interface TracerData {
  pcInstMap: { [key: string]: Instruction }
  trace: TraceEntry[]
  memory: { [key: string]: string }
  pcToInstIndexesMap: { [key: string]: number }
}

interface TracerProps {
  mainHeight: number
  barHeight: number
  tracerData?: TracerData
}

export const Tracer = ({ tracerData, mainHeight, barHeight }: TracerProps) => {
  const { onExecutionStepChange, executionTraceStepNumber } =
    useContext(CairoVMApiContext)

  const trace = tracerData?.trace
  const currentTraceEntry = tracerData?.trace[executionTraceStepNumber]

  useEffect(() => {
    const element = tableRef.current?.querySelector(
      '#focus_row',
    ) as HTMLElement | null
    if (tableRef.current && element?.offsetTop) {
      tableRef.current.scrollTop = element.offsetTop - 58
    }
  }, [currentTraceEntry])

  const tableRef = useRef<HTMLDivElement>(null)

  function stepIn() {
    if (
      !trace ||
      trace.length === 0 ||
      executionTraceStepNumber === trace.length - 1
    ) {
      return
    }
    onExecutionStepChange(executionTraceStepNumber + 1)
  }

  function stepOut() {
    if (!trace || trace.length === 0 || executionTraceStepNumber === 0) {
      return
    }
    onExecutionStepChange(executionTraceStepNumber - 1)
  }

  return (
    <>
      <div className="border-t md:border-t-0 border-b border-gray-200 dark:border-black-500 flex items-center pl-4 pr-6 h-14">
        <ExecutionStatus onStepIn={stepIn} onStepOut={stepOut} />
      </div>
      {tracerData && currentTraceEntry && trace && (
        <>
          <div
            ref={tableRef}
            className="overflow-auto pane pane-light relative bg-gray-50 dark:bg-black-600 border-gray-200 dark:border-black-500"
            style={{ height: mainHeight }}
          >
            <InstructionsTable
              memory={tracerData.memory}
              pcInstMap={tracerData.pcInstMap}
              currentTraceEntry={currentTraceEntry}
            />
          </div>
          <div style={{ height: barHeight }}>
            <InfoBar
              trace={trace}
              currentStep={executionTraceStepNumber}
              currentTraceEntry={currentTraceEntry}
            />
          </div>
        </>
      )}
    </>
  )
}

function InfoBar({
  currentStep,
  currentTraceEntry,
  trace,
}: {
  currentStep: number
  currentTraceEntry: TraceEntry
  trace: TraceEntry[]
}) {
  return (
    <div className="h-full px-4 flex items-center justify-between text-sm">
      <div className="flex gap-2">
        <span
          className={`inline-flex items-center rounded-md bg-fuchsia-50 px-2 text-xs font-medium text-fuchsia-700 border border-fuchsia-700/10`}
        >
          <span className={`border-r border-fuchsia-700/10 pr-2 mr-2 py-1`}>
            pc
          </span>
          <span className="font-mono">{currentTraceEntry.pc}</span>
        </span>
        <span
          className={`inline-flex items-center rounded-md bg-green-50 px-2 text-xs font-medium text-green-700 border border-green-700/10`}
        >
          <span className={`border-r border-green-700/10 pr-2 mr-2 py-1`}>
            fp
          </span>
          <span className="font-mono">{currentTraceEntry.fp}</span>
        </span>
        <span
          className={`inline-flex items-center rounded-md bg-orange-50 px-2 text-xs font-medium text-orange-700 border border-orange-700/10`}
        >
          <span className={`border-r border-orange-700/10 pr-2 mr-2 py-1`}>
            ap
          </span>
          <span className="font-mono">{currentTraceEntry.ap}</span>
        </span>
      </div>
      <div>
        <span className="inline-block mr-1 text-gray-500 text-sm select-none">
          Current step:
        </span>
        <span
          className="inline-block mr-4 select-all cursor-help font-mono"
          data-tip="Step number of the current instruction"
        >
          {currentStep + 1}
        </span>
        <span className="inline-block mr-1 text-gray-500 text-sm select-none">
          Total:
        </span>
        <span
          className="inline-block mr-4 select-all cursor-help font-mono"
          data-tip="Total number of steps of the entire execution"
        >
          {trace.length}
        </span>

        <ReactTooltip className="tooltip" effect="solid" />
      </div>
    </div>
  )
}

function InstructionsTable({
  memory,
  pcInstMap,
  currentTraceEntry,
}: {
  memory: TracerData['memory']
  pcInstMap: TracerData['pcInstMap']
  currentTraceEntry: TraceEntry
}) {
  const { pc, ap, fp } = currentTraceEntry

  return (
    <table className="w-full font-mono text-tiny">
      <thead>
        <tr className="text-left sticky top-0 bg-gray-50 dark:bg-black-600 text-gray-400 dark:text-gray-600 border-b border-gray-200 dark:border-black-500">
          <th className="py-1"></th>
          <th className="py-1"></th>
          <th className="py-1 px-2 font-thin">memory</th>
          <th className="py-1 px-2 font-thin">opcode</th>
          <th className="py-1 px-2 font-thin">off0</th>
          <th className="py-1 px-2 font-thin">off1</th>
          <th className="py-1 px-2 font-thin">off2</th>
          <th className="py-1 px-2 font-thin">dst</th>
          <th className="py-1 px-2 font-thin">op0</th>
          <th className="py-1 px-2 font-thin">op1</th>
          <th className="py-1 px-2 font-thin">res</th>
          <th className="py-1 px-2 font-thin">pc_update</th>
          <th className="py-1 px-2 font-thin">ap_update</th>
          <th className="py-1 px-2 font-thin">fp_update</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(memory).map((addr) => {
          const isCurrent = pc.toString() === addr
          const isFocus = isCurrent
          const addrNum = Number(addr)
          return (
            <tr
              key={addr}
              id={isFocus ? 'focus_row' : undefined}
              className={`border-b text-gray-400 dark:text-gray-600 border-gray-200 dark:border-black-500 ${
                isCurrent ? 'text-gray-900 dark:text-gray-200' : ''
              }`}
            >
              <td className="pl-4 pr-2">
                {addrNum === pc && (
                  <span className="text-fuchsia-700">[pc]</span>
                )}
                {addrNum === ap && (
                  <span className="text-orange-700">[ap]</span>
                )}
                {addrNum === fp && <span className="text-green-700">[fp]</span>}
              </td>
              <td className="py-1 px-2 whitespace-nowrap">{addr}</td>
              <td className="py-1 px-2 max-w-40 break-words">{memory[addr]}</td>
              {pcInstMap[addr] && (
                <>
                  <td className="py-1 px-2">{pcInstMap[addr].opcode}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].off0}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].off1}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].off2}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].dst_register}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].op0_register}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].op1_addr}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].res}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].pc_update}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].ap_update}</td>
                  <td className="py-1 px-2">{pcInstMap[addr].fp_update}</td>
                </>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
