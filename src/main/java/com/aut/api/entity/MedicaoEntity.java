package com.aut.api.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "medicoes")
public class MedicaoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    private BigDecimal pa;
    private BigDecimal pb;
    private BigDecimal pc;
    private BigDecimal pt;

    private BigDecimal qa;
    private BigDecimal qb;
    private BigDecimal qc;
    private BigDecimal qt;

    private BigDecimal sa;
    private BigDecimal sb;
    private BigDecimal sc;
    private BigDecimal st;

    private BigDecimal uarms;
    private BigDecimal ubrms;
    private BigDecimal ucrms;

    private BigDecimal iarms;
    private BigDecimal ibrms;
    private BigDecimal icrms;
    private BigDecimal itrms;

    private BigDecimal pfa;
    private BigDecimal pfb;
    private BigDecimal pfc;
    private BigDecimal pft;

    private BigDecimal pga;
    private BigDecimal pgb;
    private BigDecimal pgc;

    private BigDecimal freq;

    private BigDecimal epaC;
    private BigDecimal epbC;
    private BigDecimal epcC;
    private BigDecimal eptC;

    private BigDecimal epaG;
    private BigDecimal epbG;
    private BigDecimal epcG;
    private BigDecimal eptG;

    private BigDecimal yuaub;
    private BigDecimal yuauc;
    private BigDecimal yubuc;

    private BigDecimal tpsd;
    private BigDecimal rssiWifi;

    @Column(name = "data_hora")
    private OffsetDateTime dataHora;

    public OffsetDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(OffsetDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public BigDecimal getRssiWifi() {
        return rssiWifi;
    }

    public void setRssiWifi(BigDecimal rssiWifi) {
        this.rssiWifi = rssiWifi;
    }

    public BigDecimal getTpsd() {
        return tpsd;
    }

    public void setTpsd(BigDecimal tpsd) {
        this.tpsd = tpsd;
    }

    public BigDecimal getYubuc() {
        return yubuc;
    }

    public void setYubuc(BigDecimal yubuc) {
        this.yubuc = yubuc;
    }

    public BigDecimal getYuauc() {
        return yuauc;
    }

    public void setYuauc(BigDecimal yuauc) {
        this.yuauc = yuauc;
    }

    public BigDecimal getYuaub() {
        return yuaub;
    }

    public void setYuaub(BigDecimal yuaub) {
        this.yuaub = yuaub;
    }

    public BigDecimal getEptG() {
        return eptG;
    }

    public void setEptG(BigDecimal eptG) {
        this.eptG = eptG;
    }

    public BigDecimal getEpcG() {
        return epcG;
    }

    public void setEpcG(BigDecimal epcG) {
        this.epcG = epcG;
    }

    public BigDecimal getEpbG() {
        return epbG;
    }

    public void setEpbG(BigDecimal epbG) {
        this.epbG = epbG;
    }

    public BigDecimal getEpaG() {
        return epaG;
    }

    public void setEpaG(BigDecimal epaG) {
        this.epaG = epaG;
    }

    public BigDecimal getEptC() {
        return eptC;
    }

    public void setEptC(BigDecimal eptC) {
        this.eptC = eptC;
    }

    public BigDecimal getEpcC() {
        return epcC;
    }

    public void setEpcC(BigDecimal epcC) {
        this.epcC = epcC;
    }

    public BigDecimal getEpbC() {
        return epbC;
    }

    public void setEpbC(BigDecimal epbC) {
        this.epbC = epbC;
    }

    public BigDecimal getEpaC() {
        return epaC;
    }

    public void setEpaC(BigDecimal epaC) {
        this.epaC = epaC;
    }

    public BigDecimal getFreq() {
        return freq;
    }

    public void setFreq(BigDecimal freq) {
        this.freq = freq;
    }

    public BigDecimal getPgc() {
        return pgc;
    }

    public void setPgc(BigDecimal pgc) {
        this.pgc = pgc;
    }

    public BigDecimal getPgb() {
        return pgb;
    }

    public void setPgb(BigDecimal pgb) {
        this.pgb = pgb;
    }

    public BigDecimal getPga() {
        return pga;
    }

    public void setPga(BigDecimal pga) {
        this.pga = pga;
    }

    public BigDecimal getPft() {
        return pft;
    }

    public void setPft(BigDecimal pft) {
        this.pft = pft;
    }

    public BigDecimal getPfc() {
        return pfc;
    }

    public void setPfc(BigDecimal pfc) {
        this.pfc = pfc;
    }

    public BigDecimal getPfb() {
        return pfb;
    }

    public void setPfb(BigDecimal pfb) {
        this.pfb = pfb;
    }

    public BigDecimal getPfa() {
        return pfa;
    }

    public void setPfa(BigDecimal pfa) {
        this.pfa = pfa;
    }

    public BigDecimal getItrms() {
        return itrms;
    }

    public void setItrms(BigDecimal itrms) {
        this.itrms = itrms;
    }

    public BigDecimal getIcrms() {
        return icrms;
    }

    public void setIcrms(BigDecimal icrms) {
        this.icrms = icrms;
    }

    public BigDecimal getIbrms() {
        return ibrms;
    }

    public void setIbrms(BigDecimal ibrms) {
        this.ibrms = ibrms;
    }

    public BigDecimal getIarms() {
        return iarms;
    }

    public void setIarms(BigDecimal iarms) {
        this.iarms = iarms;
    }

    public BigDecimal getUcrms() {
        return ucrms;
    }

    public void setUcrms(BigDecimal ucrms) {
        this.ucrms = ucrms;
    }

    public BigDecimal getUbrms() {
        return ubrms;
    }

    public void setUbrms(BigDecimal ubrms) {
        this.ubrms = ubrms;
    }

    public BigDecimal getUarms() {
        return uarms;
    }

    public void setUarms(BigDecimal uarms) {
        this.uarms = uarms;
    }

    public BigDecimal getSt() {
        return st;
    }

    public void setSt(BigDecimal st) {
        this.st = st;
    }

    public BigDecimal getSc() {
        return sc;
    }

    public void setSc(BigDecimal sc) {
        this.sc = sc;
    }

    public BigDecimal getSb() {
        return sb;
    }

    public void setSb(BigDecimal sb) {
        this.sb = sb;
    }

    public BigDecimal getSa() {
        return sa;
    }

    public void setSa(BigDecimal sa) {
        this.sa = sa;
    }

    public BigDecimal getQt() {
        return qt;
    }

    public void setQt(BigDecimal qt) {
        this.qt = qt;
    }

    public BigDecimal getQc() {
        return qc;
    }

    public void setQc(BigDecimal qc) {
        this.qc = qc;
    }

    public BigDecimal getQb() {
        return qb;
    }

    public void setQb(BigDecimal qb) {
        this.qb = qb;
    }

    public BigDecimal getQa() {
        return qa;
    }

    public void setQa(BigDecimal qa) {
        this.qa = qa;
    }

    public BigDecimal getPt() {
        return pt;
    }

    public void setPt(BigDecimal pt) {
        this.pt = pt;
    }

    public BigDecimal getPc() {
        return pc;
    }

    public void setPc(BigDecimal pc) {
        this.pc = pc;
    }

    public BigDecimal getPb() {
        return pb;
    }

    public void setPb(BigDecimal pb) {
        this.pb = pb;
    }

    public BigDecimal getPa() {
        return pa;
    }

    public void setPa(BigDecimal pa) {
        this.pa = pa;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}

